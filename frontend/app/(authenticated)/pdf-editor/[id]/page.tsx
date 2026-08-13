"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function PdfEditorPage() {
    const params = useParams();
    const router = useRouter();

    const documentId = params.id as string;

    const viewerRef = useRef<HTMLDivElement>(null);
    const viewerInstanceRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function initializeViewer() {
            try {
                // --------------------------------------------------
                // 1. Get document
                // --------------------------------------------------

                // --------------------------------------------------
                // 1. Get document from Supabase
                // --------------------------------------------------

                const { data: document, error: documentError } =
                    await supabase
                        .from("documents")
                        .select("id, name, file_url, file_type")
                        .eq("id", documentId)
                        .single();

                if (documentError) {
                    console.error(
                        "Error fetching document:",
                        documentError
                    );

                    throw new Error(
                        documentError.message ||
                        "Failed to fetch document."
                    );
                }

                if (!document) {
                    throw new Error(
                        "Document not found."
                    );
                }

                if (!document.file_url) {
                    throw new Error(
                        "Document does not have a file URL."
                    );
                }

                // --------------------------------------------------
                // 2. Create signed URL
                // --------------------------------------------------

                const { data: signedUrlData, error: signedUrlError } =
                    await supabase.storage
                        .from("documents")
                        .createSignedUrl(
                            document.file_url,
                            3600
                        );

                if (signedUrlError) {
                    console.error(
                        "Error creating signed URL:",
                        signedUrlError
                    );

                    throw new Error(
                        signedUrlError.message ||
                        "Failed to create signed PDF URL."
                    );
                }

                if (!signedUrlData?.signedUrl) {
                    throw new Error(
                        "Supabase did not return a signed PDF URL."
                    );
                }

                const pdfUrl = signedUrlData.signedUrl;

                console.log(
                    "PDF URL generated successfully."
                );

                let pdfUrlFinal = pdfUrl;

                const markdownMatch = pdfUrl.match(
                    /^\[.*\]\((https?:\/\/.*)\)$/
                );

                if (markdownMatch) {
                    pdfUrlFinal = markdownMatch[1];
                }

                pdfUrlFinal = pdfUrlFinal.replace(
                    /^["']|["']$/g,
                    ""
                );

                if (
                    !pdfUrl.startsWith("http://") &&
                    !pdfUrl.startsWith("https://")
                ) {
                    throw new Error(
                        "The document file URL is invalid."
                    );
                }

                if (!viewerRef.current) {
                    throw new Error(
                        "PDF viewer container is not available."
                    );
                }

                // Import ComPDFKit
                const ComPDFKitViewer =
                    (
                        await import(
                            "@compdfkit_pdf_sdk/webviewer"
                        )
                    ).default;

                if (!ComPDFKitViewer) {
                    throw new Error(
                        "ComPDFKitViewer module is undefined."
                    );
                }

                if (!mounted) return;

                // Initialize editor
                const instance =
                    await ComPDFKitViewer.init(
                        {
                            path: "/",
                            pdfUrl,
                            license:
                                process.env
                                    .NEXT_PUBLIC_COMPDFKIT_LICENSE ||
                                "",
                        },
                        viewerRef.current
                    );

                if (!mounted) return;

                viewerInstanceRef.current = instance;

                setLoading(false);
            } catch (err) {
                console.error(
                    "COMPDFKIT INITIALIZATION ERROR:",
                    err
                );

                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load PDF editor"
                    );

                    setLoading(false);
                }
            }
        }

        initializeViewer();

        return () => {
            mounted = false;
        };
    }, [documentId]);

    async function saveChanges() {
        if (!viewerInstanceRef.current) return;

        try {
            setSaving(true);
            setError("");

            const {
                data: { session },
            } = await supabase.auth.getSession();

            const token = session?.access_token;

            if (!token) {
                throw new Error("You are not authenticated.");
            }

            const docViewer =
                viewerInstanceRef.current.docViewer;

            const pdfArrayBuffer =
                await docViewer.exportPDF(true);

            const blob = new Blob(
                [pdfArrayBuffer],
                {
                    type: "application/pdf",
                }
            );

            const formData = new FormData();

            formData.append(
                "file",
                blob,
                "edited.pdf"
            );

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/edit`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const responseText = await response.text();

            console.log("SAVE API STATUS:", response.status);
            console.log("SAVE API RESPONSE:", responseText);

            if (!response.ok) {
                throw new Error(
                    `Save API returned ${response.status}: ${responseText}`
                );
            }

            const result = JSON.parse(responseText);

            console.log("PDF saved successfully:", result);

            router.back();

        } catch (err) {
            console.error(
                "SAVE PDF ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save PDF"
            );

            setSaving(false);
        }
    }

    return (
        <main className="h-screen w-screen flex flex-col bg-[#f7f7f7]">
            {/* Ragnar header */}
            <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-900 text-xl transition"
                        aria-label="Go back"
                    >
                        ←
                    </button>

                    <div className="h-5 w-px bg-gray-200" />

                    <h1 className="text-sm font-medium text-gray-800">
                        Edit PDF
                    </h1>
                </div>

                <button
                    onClick={saveChanges}
                    disabled={saving || loading}
                    className="px-4 py-1.5 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving
                        ? "Saving..."
                        : "Save"}
                </button>
            </header>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 px-5 py-2 text-sm border-b border-red-100">
                    {error}
                </div>
            )}

            {/* Editor */}
            <div className="relative flex-1 min-h-0">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f7f7f7]">
                        <div className="text-center">
                            <div className="text-sm font-medium text-gray-800">
                                Loading editor...
                            </div>

                            <div className="text-xs text-gray-400 mt-1">
                                Please wait
                            </div>
                        </div>
                    </div>
                )}

                <div
                    ref={viewerRef}
                    className="h-full w-full"
                />
            </div>
        </main>
    );
}