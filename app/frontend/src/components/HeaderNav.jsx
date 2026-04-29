const Headernav= () => {

    return(
        <>
                <header class="header">
            <div class="user-link" onclick="location.href='my_page.html'">
                이채훈 <span>(SKM)</span>
            </div>
            <div class="header-action" onclick="location.href='index.html'">로그아웃</div>
            <div class="header-action" onclick="toggleNoti()">
                알림
                <div class="noti-dot"></div>
            </div>
        </header>
        </>
    )

}

export default Headernav