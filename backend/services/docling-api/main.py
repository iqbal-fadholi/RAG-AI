import os
import tempfile
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from docling.document_converter import DocumentConverter

app = FastAPI(title="Docling API Service")
converter = DocumentConverter()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/parse")
async def parse_document(file: UploadFile = File(...)):
    # Save uploaded file to a temporary location
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Convert the document
        result = converter.convert(tmp_path)
        markdown_text = result.document.export_to_markdown()

        # Clean up temp file
        os.remove(tmp_path)

        return JSONResponse(content={
            "filename": file.filename,
            "markdown": markdown_text
        })
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
