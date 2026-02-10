from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router.model_config import router as model_config_router
from api.router.model_output import router as model_output_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)
app.include_router(model_config_router, prefix="/api")
app.include_router(model_output_router, prefix="/api")

@app.get("/health_check")
async def health_check():
    response = {
        "Method": "GET",
        "State": "Success",
        "Data": "healthy",
        "message": "GET Success",
    }
    return response