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
                            theme: "dark",
                        },
                        viewerRef.current
                    );

                if (!mounted) return;

                viewerInstanceRef.current = instance;

                instance.UI.setTheme("DARK");

                instance.UI.setHeaderItems((header: any) => {
                    header.push({
                        type: "actionButton",
                        dataElement: "customDownloadButton",
                        title: "Download",
                        img: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M14.3596 8.35973L10.7499 11.9694L10.7499 2C10.7499 1.58579 10.4142 1.25 9.99994 1.25C9.58573 1.25 9.24994 1.58579 9.24994 2L9.24994 11.9694L5.64024 8.35973C5.34735 8.06683 4.87247 8.06683 4.57958 8.35973C4.28669 8.65262 4.28669 9.12749 4.57958 9.42039L9.46961 14.3104C9.7625 14.6033 10.2374 14.6033 10.5303 14.3104L15.4203 9.42039C15.7132 9.12749 15.7132 9.12749 15.4203 8.35973ZM2.99994 16.1538C2.58573 16.1538 2.24994 16.4896 2.24994 16.9038C2.24994 17.318 2.58573 17.6538 2.99994 17.6538H17.3076C17.7218 17.6538 18.0576 17.318 18.0576 16.9038C18.0576 16.4896 17.7218 16.1538 17.3076 16.1538H2.99994Z"
                fill="currentColor"
            />
        </svg>`,
                        onClick: async () => {
                            try {
                                const pdfArrayBuffer =
                                    await instance.docViewer.download();

                                const blob = new Blob(
                                    [pdfArrayBuffer],
                                    {
                                        type: "application/pdf",
                                    }
                                );

                                const url =
                                    URL.createObjectURL(blob);

                                const a =
                                    window.document.createElement("a");

                                a.href = url;
                                a.download = document.name.endsWith(".pdf")
                                    ? document.name
                                    : `${document.name}.pdf`;

                                window.document.body.appendChild(a);
                                a.click();
                                a.remove();

                                URL.revokeObjectURL(url);
                            } catch (error) {
                                console.error(
                                    "DOWNLOAD ERROR:",
                                    error
                                );
                            }
                        },
                    });
                    const items = header.getItems();

                    const filteredItems = items.filter(
                        (item: any) => item.type !== "divider"
                    );

                    header.update(filteredItems);
                });

                instance.docViewer.addEvent("documentloaded", () => {
                    console.log(
                        "PDF loaded. Current scale:",
                        instance.docViewer.scale
                    );

                    instance.docViewer.webViewerScaleChanged(1);

                    console.log(
                        "New scale:",
                        instance.docViewer.scale
                    );
                });

                // Hide unnecessary toolbar groups
                instance.UI.disableElements([
                    "toolbarGroup-Measurement",
                    "toolbarGroup-Security",
                    "toolbarGroup-Compare",
                    "toolbarGroup-Separation",
                    "cropPageButton",
                    "openFileButton",
                    "flattenButton",
                    "printButton",
                    "theme",
                    "theme",
                    "pageModeButton",
                    "settingButton",
                    "leftPanelButton",
                    "downloadButton",
                    "fullScreenButton",
                    "handToolButton",
                ]);

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
        <main className="h-full w-full flex flex-col bg-[#f7f7f7] overflow-hidden">
            {/* Ragnar header */}
            <header className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-100 transition"
                        aria-label="Go back"
                    >
                        ←
                    </button>

                    <div className="h-5 w-px bg-gray-700" />

                    <h1 className="text-sm font-medium text-gray-100">
                        Edit PDF
                    </h1>
                </div>

                <button
                    onClick={saveChanges}
                    disabled={saving || loading}
                    className="px-4 py-2 rounded-xl bg-gray-700 text-gray-100 text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </header>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 px-5 py-2 text-sm border-b border-red-100">
                    {error}
                </div>
            )}

            {/* Editor */}
            <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
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