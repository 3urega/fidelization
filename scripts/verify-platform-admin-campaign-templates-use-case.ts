/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreatePlatformCampaignTemplate } from "../src/contexts/platform/application/campaign_templates/CreatePlatformCampaignTemplate";
import { ListPlatformCampaignTemplates } from "../src/contexts/platform/application/campaign_templates/ListPlatformCampaignTemplates";
import { UpdatePlatformCampaignTemplate } from "../src/contexts/platform/application/campaign_templates/UpdatePlatformCampaignTemplate";
import { InvalidPlatformCampaignTemplate } from "../src/contexts/platform/domain/InvalidPlatformCampaignTemplate";
import {
	PlatformCampaignTemplate,
} from "../src/contexts/platform/domain/PlatformCampaignTemplate";
import { PlatformCampaignTemplateNotFound } from "../src/contexts/platform/domain/PlatformCampaignTemplateNotFound";
import {
	type ListPlatformCampaignTemplatesParams,
	PlatformCampaignTemplateRepository,
} from "../src/contexts/platform/domain/PlatformCampaignTemplateRepository";

const activeCoffee = PlatformCampaignTemplate.fromPrimitives({
	id: "template-coffee",
	name: "10 cafés = 1 gratis",
	description: "Tarjeta clásica de café",
	requiredStamps: 10,
	suggestedStampTypeLabel: "Café",
	visualTemplate: "coffee",
	cardBackgroundVariant: "coffee-photo",
	conditions: "",
	isActive: true,
	sortOrder: 1,
});

const inactiveCroissant = PlatformCampaignTemplate.fromPrimitives({
	id: "template-croissant",
	name: "8 croissants = 1 gratis",
	description: "Plantilla desactivada",
	requiredStamps: 8,
	suggestedStampTypeLabel: "Croissant",
	visualTemplate: "croissant",
	cardBackgroundVariant: "coffee-sketch",
	conditions: "",
	isActive: false,
	sortOrder: 2,
});

class InMemoryPlatformCampaignTemplateRepository extends PlatformCampaignTemplateRepository {
	constructor(private templates: PlatformCampaignTemplate[]) {
		super();
	}

	async list(params: ListPlatformCampaignTemplatesParams): Promise<PlatformCampaignTemplate[]> {
		let rows = [...this.templates];

		if (params.activeOnly) {
			rows = rows.filter((template) => template.toPrimitives().isActive);
		}

		return rows.sort((left, right) => {
			const leftOrder = left.toPrimitives().sortOrder;
			const rightOrder = right.toPrimitives().sortOrder;

			if (leftOrder !== rightOrder) {
				return leftOrder - rightOrder;
			}

			return left.toPrimitives().name.localeCompare(right.toPrimitives().name);
		});
	}

	async searchById(id: string): Promise<PlatformCampaignTemplate | null> {
		return this.templates.find((template) => template.toPrimitives().id === id) ?? null;
	}

	async save(template: PlatformCampaignTemplate): Promise<void> {
		const primitives = template.toPrimitives();
		const index = this.templates.findIndex((row) => row.toPrimitives().id === primitives.id);

		if (index >= 0) {
			this.templates[index] = template;

			return;
		}

		this.templates.push(template);
	}

	async maxSortOrder(): Promise<number> {
		if (this.templates.length === 0) {
			return 0;
		}

		return Math.max(...this.templates.map((template) => template.toPrimitives().sortOrder));
	}
}

async function main(): Promise<void> {
	const repository = new InMemoryPlatformCampaignTemplateRepository([
		activeCoffee,
		inactiveCroissant,
	]);
	const listUseCase = new ListPlatformCampaignTemplates(repository);
	const createUseCase = new CreatePlatformCampaignTemplate(repository);
	const updateUseCase = new UpdatePlatformCampaignTemplate(repository);

	const all = await listUseCase.execute();

	if (all.length !== 2) {
		console.error("❌ list all templates", all.length);
		process.exit(1);
	}

	const activeOnly = await listUseCase.execute({ activeOnly: true });

	if (activeOnly.length !== 1 || activeOnly[0]?.toPrimitives().id !== activeCoffee.toPrimitives().id) {
		console.error("❌ activeOnly excludes inactive template", activeOnly);
		process.exit(1);
	}

	console.log("✅ ListPlatformCampaignTemplates all vs activeOnly");

	const created = await createUseCase.execute({
		input: {
			name: "5 matchas = 1 gratis",
			description: "Campaña matcha",
			requiredStamps: 5,
			suggestedStampTypeLabel: "Matcha",
			visualTemplate: "generic",
			cardBackgroundVariant: "coffee-minimal",
		},
	});

	if (
		created.toPrimitives().name !== "5 matchas = 1 gratis" ||
		created.toPrimitives().sortOrder !== 3 ||
		!created.toPrimitives().isActive
	) {
		console.error("❌ CreatePlatformCampaignTemplate", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreatePlatformCampaignTemplate");

	const deactivated = await updateUseCase.execute({
		templateId: created.toPrimitives().id,
		input: { isActive: false },
	});

	if (deactivated.toPrimitives().isActive) {
		console.error("❌ UpdatePlatformCampaignTemplate deactivate", deactivated.toPrimitives());
		process.exit(1);
	}

	const activeAfterDeactivate = await listUseCase.execute({ activeOnly: true });

	if (activeAfterDeactivate.length !== 1) {
		console.error("❌ inactive template hidden from activeOnly", activeAfterDeactivate);
		process.exit(1);
	}

	console.log("✅ UpdatePlatformCampaignTemplate deactivate");

	try {
		await updateUseCase.execute({
			templateId: "missing-template",
			input: { name: "Nope" },
		});
		console.error("❌ expected PlatformCampaignTemplateNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlatformCampaignTemplateNotFound)) {
			console.error("❌ unexpected not-found error", error);
			process.exit(1);
		}
	}

	try {
		await createUseCase.execute({ input: { name: "", requiredStamps: 10 } });
		console.error("❌ expected InvalidPlatformCampaignTemplate for empty name");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidPlatformCampaignTemplate)) {
			console.error("❌ unexpected validation error", error);
			process.exit(1);
		}
	}

	console.log("✅ validation + not found errors");
	console.log("✅ verify:platform-admin-campaign-templates-use-case passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
