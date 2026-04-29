import Swal from 'sweetalert2'
import '@components/ServiceAlert/ServiceAlert.css'

// ―――――――――― [ Gate페이지 서비스 소개 (showServiceIntro) ] ―――――――――――――――――――――――――――――――――――――――――――――――
  /**
   * 서비스 소개 커스텀 알럿 함수
   * @param {string} title - 서비스 제목
   * @param {string} text - 서비스 상세 설명 (HTML 지원)
   * @param {string} iconUrl - 표시할 아이콘 이미지 경로
   */
  
export const showServiceIntro = (title, text, iconUrl) => {
  Swal.fire({
    title: `<strong class="custom-swal-title">${title}</strong>`,
    html: `<div class="custom-swal-text">${text}</div>`,
    iconHtml: `<img src="${iconUrl}" class="custom-swal-icon-img" alt="service icon">`,
    customClass: {
      popup: 'custom-swal-popup',
      icon: 'custom-swal-icon-container',
      confirmButton: 'custom-swal-confirm-btn'
    },
    confirmButtonText: '확인',
    confirmButtonColor: '#03a94d',
    showCloseButton: true,
    backdrop: `rgba(0,0,0,0.5)`,
    heightAuto: false
  });
};
