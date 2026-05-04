from fastapi import APIRouter

router = APIRouter()

@router.get("", 
        summary="알람 목록 조회", 
        description="알람 목록 조회")
def getAlarms():
    pass

@router.patch("",
        summary="알람 읽음 처리",
        description="개별 또는 전체 알람을 읽음 상태로 변경")
def patchAlarm():
    pass

@router.delete("",
        summary="알람 목록 삭제",
        description="알람 목록 삭제")
def alarmDel():
   pass

@router.websocket("/ws",
        summary="실시간 알람",
        description="웹소켓을 통해 실시간으로 알람을 수신")
def alarmWebSocket():
    pass
