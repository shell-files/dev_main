from fastapi import APIRouter

router = APIRouter()

@router.post("/", 
        summary="kafka cs", 
        description="kafka cs 구동")
def kafkaCs():
    pass