"use client";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";
import WebViewer from "@compdfkit_pdf_sdk/webviewer";

export type PdfEditorHandle = {
    exportPdf: () => Promise<Blob>;
};

type PdfEditorProps = {
    url: string;
};

const PdfEditor = forwardRef<PdfEditorHandle, PdfEditorProps>(
    function PdfEditor({ url }, ref) {
        const viewerRef = useRef<HTMLDivElement>(null);
        const docViewerRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            exportPdf: async () => {
                if (!docViewerRef.current) {
                    throw new Error("PDF viewer is not initialized.");
                }

                const arrayBuffer =
                    await docViewerRef.current.exportPDF(false);

                return new Blob([arrayBuffer], {
                    type: "application/pdf",
                });
            },
        }));

        useEffect(() => {
            if (!viewerRef.current || !url) return;

            WebViewer.init(
                {
                    path: "/",
                    pdfUrl: url,
                    license: process.env.NEXT_PUBLIC_COMPDFKIT_LICENSE,
                },
                viewerRef.current
            ).then((instance: any) => {
                console.log("ComPDFKit initialized");

                const { docViewer } = instance;

                docViewerRef.current = docViewer;

                docViewer.addEvent("documentloaded", () => {
                    console.log("PDF LOADED!");
                });
            });
        }, [url]);

        return (
            <div
                ref={viewerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}
            />
        );
    }
);

export default PdfEditor;