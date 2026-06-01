import { StructuredOutputParser } from "@langchain/core/output_parsers";
import {
	ChatPromptTemplate,
	HumanMessagePromptTemplate,
	SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOllama } from "@langchain/ollama";
import { Service } from "diod";
import { z } from "zod";

import { Course } from "../../courses/domain/Course";
import { CourseId } from "../../courses/domain/CourseId";
import { CourseRepository } from "../../courses/domain/CourseRepository";
import { CourseSuggestion } from "../domain/CourseSuggestion";
import { CourseSuggestionsGenerator } from "../domain/CourseSuggestionsGenerator";
import { UserCourseSuggestions } from "../domain/UserCourseSuggestions";

/**
 * Implementación "infrastructure" del caso de uso de sugerencias de cursos.
 *
 * - **Qué hace**: dada la lista de cursos que una persona completó, busca cursos "similares"
 *   en el repositorio y le pide a un LLM (ejecutado en Ollama) que seleccione las 3 mejores
 *   recomendaciones con su explicación.
 *
 * - **Por qué está aquí**: el dominio expone la abstracción `CourseSuggestionsGenerator`.
 *   Esta clase conecta esa abstracción con proveedores concretos:
 *   - `CourseRepository`: fuente de cursos y similitudes (DB/embeddings/lo que sea detrás).
 *   - LangChain + Ollama: orquestación del prompt, llamada al modelo y parseo de salida.
 *
 * - **Cómo encaja LangChain** (visión rápida):
 *   - `ChatPromptTemplate`: plantilla parametrizable que genera los mensajes del chat.
 *   - `ChatOllama`: wrapper de LangChain para invocar un modelo servido por Ollama.
 *   - `StructuredOutputParser` + Zod: fuerza a que la salida del LLM sea JSON con forma
 *     conocida; si el modelo responde algo fuera de schema, el parseo falla (mejor que
 *     “tragar” texto ambiguo).
 *   - `RunnableSequence`: pipeline que encadena pasos (prompt -> modelo -> parser).
 */
@Service()
export class OllamaLlama31CourseSuggestionsGenerator implements CourseSuggestionsGenerator {
	constructor(private readonly courseRepository: CourseRepository) {}

	async generate(userCourseSuggestions: UserCourseSuggestions): Promise<CourseSuggestion[]> {
		// El agregado de dominio se serializa a "primitives" para trabajar con IDs/string
		// sin arrastrar objetos ricos por la capa de infraestructura.
		const primitives = userCourseSuggestions.toPrimitives();

		const completedCourseIds = primitives.completedCourseIds.map((id) => new CourseId(id));

		// Fuente de candidatos: buscamos cursos similares a lo ya completado.
		// Importante: el LLM solo "elige" entre estos; aquí está el recorte de universo.
		const similarCourses = await this.courseRepository.searchSimilar(completedCourseIds);

		// Contexto adicional para el modelo: la lista de cursos completados (nombre/resumen/categorías)
		// se incluye en el prompt para justificar y evitar recomendar repetidos.
		const completedCourses = await this.courseRepository.searchByIds(completedCourseIds);

		/**
		 * Structured output en LangChain:
		 *
		 * - `StructuredOutputParser.fromZodSchema(...)` crea un parser que:
		 *   1) genera instrucciones de formato (`getFormatInstructions()`), típicamente pidiendo
		 *      JSON estricto,
		 *   2) intenta parsear/validar la respuesta del modelo contra el schema de Zod.
		 *
		 * Esto es una estrategia práctica para reducir "alucinaciones de formato":
		 * seguimos usando un modelo generativo, pero lo obligamos a encajar en una estructura
		 * que nuestro código puede consumir de forma segura.
		 */
		const outputParser = StructuredOutputParser.fromZodSchema(
			z.array(
				z.object({
					courseId: z.string().describe("Id del curso sugerido."),
					courseName: z.string().describe("Nombre del curso sugerido."),
					reason: z.string().describe("Motivo por el que se sugiere el curso."),
				}),
			),
		);

		/**
		 * Prompting con `ChatPromptTemplate`:
		 *
		 * - Es un template de chat (multi-mensaje) con variables. Aquí usamos dos mensajes:
		 *   - **System**: reglas y restricciones (selección de 3, idioma, no repetir, etc.).
		 *     En modelos chat, el mensaje de sistema suele ser el "contrato" de comportamiento.
		 *   - **Human**: los datos de entrada concretos (cursos disponibles y completados).
		 *
		 * - `{format_instructions}` viene del `outputParser` y se inyecta en el System prompt.
		 *   Esto crea un “acoplamiento intencional” entre prompt y parser: pedimos exactamente
		 *   el formato que luego validaremos.
		 */
		const chatPrompt = ChatPromptTemplate.fromMessages([
			SystemMessagePromptTemplate.fromTemplate(
				`
Eres un avanzado recomendador de cursos. Tu tarea es sugerir al usuario los 3 mejores cursos de una lista proporcionada. Ten en cuenta lo siguiente:
- Solo puedes elegir cursos de la lista disponible.
- No sugieras cursos que el usuario ya ha completado.
- Tus sugerencias son en castellano neutro e inclusivo.
- Proporciona una razón en castellano para cada curso sugerido. Ejemplo: "Porque has demostrado interés en PHP al completar el curso de DDD en PHP".
- Intenta añadir en las razones cursos similares que el usuario ya ha completado.
- Responde únicamente con el siguiente formato JSON (no añadas \`\`\`json ni nada similar a la respuesta):

{format_instructions}
        `.trim(),
			),
			HumanMessagePromptTemplate.fromTemplate(
				`
Lista de cursos disponibles (cada curso se presenta con su nombre, resumen y categorías):

{available_courses}

Cursos que el usuario ya ha completado:

{completed_courses}
        `.trim(),
			),
		]);

		/**
		 * `RunnableSequence` es el pegamento de LangChain:
		 *
		 * - Cada elemento es un "runnable" (algo invocable con input/output).
		 * - La salida de un paso alimenta el siguiente:
		 *   1) `chatPrompt`: convierte el input (variables) en mensajes de chat.
		 *   2) `ChatOllama`: envía esos mensajes al modelo en Ollama y devuelve la respuesta.
		 *   3) `outputParser`: extrae/valida el JSON y devuelve datos tipados por el schema.
		 *
		 * Nota: aquí no estamos usando "tools" (function calling) de LangChain; la palabra
		 * “tools” en este flujo es más bien “herramientas de la librería” (prompt, runnables,
		 * parsers). Si en el futuro quisiéramos que el modelo llamara funciones (p.ej. buscar
		 * más cursos bajo demanda), ahí sí entrarían `tools`/function-calling.
		 */
		const chain = RunnableSequence.from([
			chatPrompt,
			new ChatOllama({
				model: "llama3.1:8b",
				// `temperature: 0` prioriza determinismo/consistencia (útil cuando pedimos JSON).
				temperature: 0,
			}),
			outputParser,
		]);

		// Invocamos la cadena con las variables del prompt.
		// `formatCourse` aplana el objeto `Course` a texto legible para el LLM.
		const suggestions = await chain.invoke({
			available_courses: similarCourses.map((c) => this.formatCourse(c)).join("\n\n"),
			completed_courses: completedCourses.map((c) => this.formatCourse(c)).join("\n\n"),
			format_instructions: outputParser.getFormatInstructions(),
		});

		// Convertimos la estructura parseada (JSON validado) a objetos de dominio.
		// El dominio decide qué guarda exactamente como "sugerencia" (aquí: id + razón).
		return suggestions.map(
			(suggestion) => new CourseSuggestion(suggestion.courseId, suggestion.reason),
		);
	}

	formatCourse(course: Course): string {
		// Formato humano (no JSON) para maximizar comprensión del LLM.
		// Se incluyen campos que suelen ser útiles para justificar recomendaciones:
		// nombre, resumen y categorías (además de la id para poder referenciarlo).
		return `
- Id: ${course.id.value}
  Nombre: ${course.name}
  Resumen: ${course.summary}
  Categorías: ${course.categories.join(", ")}
		`.trim();
	}
}
