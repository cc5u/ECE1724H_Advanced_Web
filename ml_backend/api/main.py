from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router.model_config import router as model_config_router
from api.router.model_output import router as model_output_router
from api.router.model_train import router as model_train_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)
# app.include_router(model_config_router, prefix="/model_api")
app.include_router(model_output_router, prefix="/model_api")
app.include_router(model_train_router, prefix="/model_api")

@app.get("/model_api/health_check")
async def health_check():
    response = {
        "Method": "GET",
        "State": "Success",
        "Data": "healthy",
        "message": "GET Success",
    }
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)