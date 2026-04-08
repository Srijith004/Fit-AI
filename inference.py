from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class InputData(BaseModel):
    weight: float
    goal: str

@app.post("/predict")
def predict(data: InputData):
    return {
        "result": f"Weight: {data.weight}, Goal: {data.goal}, Stay fit 💪"
    }
