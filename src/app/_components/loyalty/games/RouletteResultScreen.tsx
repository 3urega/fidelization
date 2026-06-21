"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactElement } from "react";

import { platformRoutes } from "../../../../lib/platform/routes";
import type { RoulettePrizeType } from "../../../../contexts/loyalty/games/domain/RoulettePrizeType";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { getRoulettePrizeIconUrl, ROULETTE_WHEEL_ASSETS } from "./rouletteAssets";

export type RouletteSpinResultView = {
	segmentLabel: string;
	prizeType: RoulettePrizeType | string;
	prize: Record<string, unknown>;
	status: string;
};

type RouletteResultScreenProps = {
	slug: string;
	result: RouletteSpinResultView;
};

function resultMessage(result: RouletteSpinResultView): string {
	switch (result.prizeType) {
		case "points":
			return `Has ganado ${String(result.prize.points ?? 0)} puntos.`;
		case "stamp":
			return "Has ganado un sello extra en tu tarjeta.";
		case "promotion":
			return "Has ganado una promoción. Revísala en tu tarjeta del local.";
		case "physical":
			return result.status === "pending_redeem"
				? "Premio físico pendiente de canje en el local."
				: "Has ganado un premio físico.";
		case "none":
		default:
			return "¡Suerte la próxima! Esta vez no hubo premio.";
	}
}

export function RouletteResultScreen({ slug, result }: RouletteResultScreenProps): ReactElement {
	const iconUrl = getRoulettePrizeIconUrl(result.prizeType);
	const isWin = result.prizeType !== "none";

	return (
		<Card className="flex flex-col items-center gap-4 text-center">
			{isWin ? (
				<div className="relative h-24 w-full max-w-sm">
					<Image
						src={ROULETTE_WHEEL_ASSETS.stateWinBanner}
						alt=""
						fill
						className="object-contain"
						sizes="400px"
					/>
				</div>
			) : null}

			<div className="relative h-16 w-16">
				<Image src={iconUrl} alt="" fill className="object-contain" sizes="64px" />
			</div>

			<div>
				<h2 className="text-lg font-semibold text-foreground">{result.segmentLabel}</h2>
				<p className="mt-2 text-sm text-muted">{resultMessage(result)}</p>
			</div>

			<Link href={platformRoutes.homeEstablishment(slug)} className="w-full">
				<Button type="button" className="w-full">
					Volver al local
				</Button>
			</Link>
		</Card>
	);
}
