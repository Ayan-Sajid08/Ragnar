from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Ragnar API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)