/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CountOpenModerationReports } from "../src/contexts/platform/application/moderation/CountOpenModerationReports";
import { ListModerationReports } from "../src/contexts/platform/application/moderation/ListModerationReports";
import { ResolveModerationReport } from "../src/contexts/platform/application/moderation/ResolveModerationReport";
import { SuspendTenantForModerationReport } from "../src/contexts/platform/application/moderation/SuspendTenantForModerationReport";
import { SetTenantPlatformStatus } from "../src/contexts/platform/application/tenants/SetTenantPlatformStatus";
import { InvalidModerationReport } from "../src/contexts/platform/domain/InvalidModerationReport";
import { ModerationReport } from "../src/contexts/platform/domain/ModerationReport";
import { ModerationReportAlreadyResolved } from "../src/contexts/platform/domain/ModerationReportAlreadyResolved";
import { ModerationReportNotFound } from "../src/contexts/platform/domain/ModerationReportNotFound";
import {
	ModerationReportRepository,
	type ModerationReportListPage,
	type ModerationReportListParams,
} from "../src/contexts/platform/domain/ModerationReportRepository";
import { ModerationReportTargetResolver } from "../src/contexts/platform/domain/ModerationReportTargetResolver";
import {
	type ModerationReportRow,
	type ModerationReportTargetContext,
	type ModerationReportTargetType,
} from "../src/contexts/platform/domain/ModerationReportTypes";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantActive = Tenant.fromPrimitives({
	id: "tenant-active",
	name: "Cafe Demo",
	slug: "cafe-demo",
	businessType: "cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "basic",
	status: TenantStatus.Active,
	features: null,
	subscriptionPlanId: null,
	address: "",
	description: "",
	latitude: null,
	longitude: null,
	geocodingProvider: null,
	geocodedAt: null,
	coverImageUrl: "",
	discoveryTags: [],
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
});

class InMemoryModerationReportTargetResolver extends ModerationReportTargetResolver {
	constructor(private readonly targets: Record<string, ModerationReportTargetContext>) {
		super();
	}

	async resolve(
		targetType: ModerationReportTargetType,
		targetId: string,
	): Promise<ModerationReportTargetContext | null> {
		return this.targets[`${targetType}:${targetId}`] ?? null;
	}
}

class InMemoryModerationReportRepository extends ModerationReportRepository {
	constructor(
		private reports: ModerationReport[],
		private readonly targetResolver: ModerationReportTargetResolver,
	) {
		super();
	}

	async findById(id: string): Promise<ModerationReport | null> {
		return this.reports.find((report) => report.id === id) ?? null;
	}

	async save(report: ModerationReport): Promise<void> {
		const index = this.reports.findIndex((row) => row.id === report.id);

		if (index >= 0) {
			this.reports[index] = report;
		}
	}

	async list(params: ModerationReportListParams): Promise<ModerationReportListPage> {
		let rows = [...this.reports];

		if (params.status) {
			rows = rows.filter((report) => report.toPrimitives().status === params.status);
		}

		rows.sort(
			(left, right) =>
				right.toPrimitives().createdAt.getTime() - left.toPrimitives().createdAt.getTime(),
		);

		const pageRows = rows.slice(params.offset, params.offset + params.limit);
		const reports: ModerationReportRow[] = await Promise.all(
			pageRows.map(async (report) => {
				const primitives = report.toPrimitives();
				const targetContext = await this.targetResolver.resolve(
					primitives.targetType,
					primitives.targetId,
				);

				return {
					id: primitives.id,
					targetType: primitives.targetType,
					targetId: primitives.targetId,
					targetLabel: targetContext?.targetLabel ?? primitives.targetId,
					tenantId: targetContext?.tenantId ?? null,
					reason: primitives.reason,
					status: primitives.status,
					reporter: {
						userId: "reporter-1",
						name: "Reporter User",
						email: "reporter@example.com",
					},
					createdAt: primitives.createdAt,
					resolvedAt: primitives.resolvedAt,
					resolvedByUserId: primitives.resolvedByUserId,
				};
			}),
		);

		return {
			reports,
			total: rows.length,
			hasMore: params.offset + params.limit < rows.length,
			offset: params.offset,
			limit: params.limit,
		};
	}

	async countOpen(): Promise<number> {
		return this.reports.filter((report) => report.isOpen()).length;
	}
}

class InMemoryTenantRepository extends TenantRepository {
	constructor(private tenants: Tenant[]) {
		super();
	}

	async findById(id: string): Promise<Tenant | null> {
		return this.tenants.find((tenant) => tenant.id === id) ?? null;
	}

	async findBySlug(_slug: string): Promise<Tenant | null> {
		return null;
	}

	async save(_tenant: Tenant): Promise<void> {}

	async updateStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
		const tenant = await this.findById(id);

		if (!tenant) {
			return null;
		}

		const updated = Tenant.fromPrimitives({
			...tenant.toPrimitives(),
			status,
			updatedAt: new Date(),
		});
		this.tenants = this.tenants.map((row) => (row.id === id ? updated : row));

		return updated;
	}
}

async function main(): Promise<void> {
	const openReport = ModerationReport.fromPrimitives({
		id: "report-open",
		reporterUserId: "reporter-1",
		targetType: "tenant",
		targetId: "tenant-active",
		reason: "Contenido inapropiado",
		status: "open",
		resolvedAt: null,
		resolvedByUserId: null,
		createdAt: new Date("2026-06-20T10:00:00Z"),
	});
	const resolvedReport = ModerationReport.fromPrimitives({
		id: "report-resolved",
		reporterUserId: "reporter-1",
		targetType: "promotion",
		targetId: "promo-1",
		reason: "Promo engañosa",
		status: "resolved",
		resolvedAt: new Date("2026-06-19T12:00:00Z"),
		resolvedByUserId: "admin-1",
		createdAt: new Date("2026-06-18T10:00:00Z"),
	});

	const targetResolver = new InMemoryModerationReportTargetResolver({
		"tenant:tenant-active": {
			targetLabel: "Cafe Demo",
			tenantId: "tenant-active",
		},
		"promotion:promo-1": {
			targetLabel: "2x1 verano",
			tenantId: "tenant-active",
		},
	});
	const repository = new InMemoryModerationReportRepository(
		[openReport, resolvedReport],
		targetResolver,
	);
	const tenantRepository = new InMemoryTenantRepository([tenantActive]);

	const listUseCase = new ListModerationReports(repository);
	const countUseCase = new CountOpenModerationReports(repository);
	const resolveUseCase = new ResolveModerationReport(repository);
	const suspendUseCase = new SuspendTenantForModerationReport(
		repository,
		targetResolver,
		new SetTenantPlatformStatus(tenantRepository),
	);

	const openList = await listUseCase.execute({ status: "open" });

	if (openList.total !== 1 || openList.reports[0]?.id !== "report-open") {
		console.error("❌ list open reports", openList);
		process.exit(1);
	}

	console.log("✅ ListModerationReports filters open queue");

	const count = await countUseCase.execute();

	if (count.openCount !== 1) {
		console.error("❌ open count", count);
		process.exit(1);
	}

	console.log("✅ CountOpenModerationReports");

	const resolved = await resolveUseCase.execute({
		reportId: "report-open",
		resolvedByUserId: "admin-1",
	});

	if (resolved.toPrimitives().status !== "resolved") {
		console.error("❌ resolve report", resolved.toPrimitives());
		process.exit(1);
	}

	const openAfterResolve = await countUseCase.execute();

	if (openAfterResolve.openCount !== 0) {
		console.error("❌ open count after resolve", openAfterResolve);
		process.exit(1);
	}

	console.log("✅ ResolveModerationReport");

	const suspendReport = ModerationReport.fromPrimitives({
		id: "report-suspend",
		reporterUserId: "reporter-1",
		targetType: "promotion",
		targetId: "promo-1",
		reason: "Fraude",
		status: "open",
		resolvedAt: null,
		resolvedByUserId: null,
		createdAt: new Date("2026-06-21T10:00:00Z"),
	});
	repository["reports"].push(suspendReport);

	const suspendResult = await suspendUseCase.execute({
		reportId: "report-suspend",
		resolvedByUserId: "admin-1",
	});

	if (
		suspendResult.tenant.toPrimitives().status !== TenantStatus.Suspended ||
		suspendResult.report.toPrimitives().status !== "resolved"
	) {
		console.error("❌ suspend tenant from report", suspendResult);
		process.exit(1);
	}

	console.log("✅ SuspendTenantForModerationReport uses SetTenantPlatformStatus");

	try {
		await resolveUseCase.execute({
			reportId: "report-resolved",
			resolvedByUserId: "admin-1",
		});
		console.error("❌ expected already resolved error");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof ModerationReportAlreadyResolved)) {
			console.error("❌ wrong already resolved error", error);
			process.exit(1);
		}
	}

	try {
		await suspendUseCase.execute({
			reportId: "missing-report",
			resolvedByUserId: "admin-1",
		});
		console.error("❌ expected not found error");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof ModerationReportNotFound)) {
			console.error("❌ wrong not found error", error);
			process.exit(1);
		}
	}

	const brokenResolver = new InMemoryModerationReportTargetResolver({});
	const brokenSuspend = new SuspendTenantForModerationReport(
		repository,
		brokenResolver,
		new SetTenantPlatformStatus(tenantRepository),
	);
	const brokenReport = ModerationReport.fromPrimitives({
		id: "report-broken",
		reporterUserId: "reporter-1",
		targetType: "tenant",
		targetId: "missing-tenant",
		reason: "Test",
		status: "open",
		resolvedAt: null,
		resolvedByUserId: null,
		createdAt: new Date(),
	});
	repository["reports"].push(brokenReport);

	try {
		await brokenSuspend.execute({
			reportId: "report-broken",
			resolvedByUserId: "admin-1",
		});
		console.error("❌ expected invalid target error");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidModerationReport)) {
			console.error("❌ wrong invalid target error", error);
			process.exit(1);
		}
	}

	try {
		await new SetTenantPlatformStatus(tenantRepository).execute(
			"missing-tenant",
			TenantStatus.Suspended,
		);
		console.error("❌ expected tenant not found from SetTenantPlatformStatus");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong tenant not found error", error);
			process.exit(1);
		}
	}

	console.log("✅ domain errors for missing report/target");

	console.log("✅ platform admin moderation use cases verified");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
