import "reflect-metadata";

import { ContainerBuilder } from "diod";

import { loadProjectEnv } from "../../../../lib/loadProjectEnv";
import { DemoPlanSetter } from "../../../billing/demo/application/DemoPlanSetter";
import { SyncUserPlanFromGooglePlay } from "../../../billing/google_play_subscription/application/sync/SyncUserPlanFromGooglePlay";
import { VerifyGooglePlayPurchase } from "../../../billing/google_play_subscription/application/verify/VerifyGooglePlayPurchase";
import { GooglePlaySubscriptionRepository } from "../../../billing/google_play_subscription/domain/GooglePlaySubscriptionRepository";
import { PostgresGooglePlaySubscriptionRepository } from "../../../billing/google_play_subscription/infrastructure/PostgresGooglePlaySubscriptionRepository";
import { UserAuthenticator } from "../../../identity/users/application/authenticate/UserAuthenticator";
import { UserFinder } from "../../../identity/users/application/find/UserFinder";
import { UserRegistrar } from "../../../identity/users/application/register/UserRegistrar";
import { UserProfileUpdater } from "../../../identity/users/application/update_profile/UserProfileUpdater";
import { UserRepository } from "../../../identity/users/domain/UserRepository";
import { PostgresUserRepository } from "../../../identity/users/infrastructure/PostgresUserRepository";
import { PostgresConnection } from "../postgres/PostgresConnection";

loadProjectEnv();

const builder = new ContainerBuilder();

builder
	.register(PostgresConnection)
	.useFactory(() => {
		return new PostgresConnection(
			process.env.POSTGRES_HOST ?? "localhost",
			Number(process.env.POSTGRES_PORT ?? "5432"),
			process.env.POSTGRES_USER ?? "codely",
			process.env.POSTGRES_PASSWORD ?? "c0d3ly7v",
			process.env.POSTGRES_DB ?? "postgres",
		);
	})
	.asSingleton();

builder.register(UserRepository).use(PostgresUserRepository);
builder.registerAndUse(PostgresUserRepository);

builder.registerAndUse(UserRegistrar);
builder.registerAndUse(UserFinder);
builder.registerAndUse(UserAuthenticator);
builder.registerAndUse(UserProfileUpdater);

builder.register(GooglePlaySubscriptionRepository).use(PostgresGooglePlaySubscriptionRepository);
builder.registerAndUse(PostgresGooglePlaySubscriptionRepository);
builder.registerAndUse(VerifyGooglePlayPurchase);
builder.registerAndUse(SyncUserPlanFromGooglePlay);

builder.registerAndUse(DemoPlanSetter);

export const container = builder.build();
