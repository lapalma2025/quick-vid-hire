import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
	return (
		<Card className="overflow-hidden h-full">
			<div className="h-36 bg-muted">
				<Skeleton className="h-full w-full rounded-none" />
			</div>
			<CardHeader className="pb-2 pt-3 px-3 space-y-2">
				<Skeleton className="h-5 w-4/5" />
				<Skeleton className="h-4 w-24" />
			</CardHeader>
			<CardContent className="pt-0 pb-3 px-3 space-y-2">
				<Skeleton className="h-4 w-3/4" />
				<div className="flex gap-3">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-16" />
				</div>
				<Skeleton className="h-6 w-36" />
				<Skeleton className="h-4 w-28" />
			</CardContent>
		</Card>
	);
}
