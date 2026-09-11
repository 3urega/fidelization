"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactElement, type ReactNode, useEffect } from "react";

import { StaffScanSessionCustomerHeader } from "./StaffScanSessionCustomerHeader";
import { useStaffScanSession } from "./StaffScanSessionProvider";
import { PageHeader } from "../shell/PageHeader";
import { Card } from "../ui/Card";

type StaffScanSessionLayoutProps = {
	title: string;
	description: string;
	children: ReactNode;
};

export function StaffScanSessionLayout({
	title,
	description,
	children,
}: StaffScanSessionLayoutProps): ReactElement {
	const searchParams = useSearchParams();
	const customerId = searchParams.get("c")?.trim() ?? "";
	const { session, loadByCustomerId } = useStaffScanSession();

	useEffect(() => {
		if (!customerId) {
			return;
		}

		if (session?.customer.id === customerId) {
			return;
		}

		void loadByCustomerId(customerId);
	}, [customerId, loadByCustomerId, session?.customer.id]);

	const hubHref = customerId ? `/scan/session?c=${encodeURIComponent(customerId)}` : "/scan";

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title={title} description={description} />
			{session && session.customer.id === customerId ? (
				<StaffScanSessionCustomerHeader customer={session.customer} />
			) : null}
			<p className="text-sm">
				<Link href={hubHref} className="text-primary underline">
					← Volver al hub de actividades
				</Link>
			</p>
			<Card>{children}</Card>
		</div>
	);
}
