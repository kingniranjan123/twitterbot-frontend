"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TweetsPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/accounts");
    }, [router]);

    return null;
}
