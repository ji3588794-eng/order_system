import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API 호출 에러:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message,
    });

    return Promise.reject(error);
  }
);

export default api;

/**
 * 이미지 및 파일 URL 생성 함수 (Cloudinary & Local Hybrid 대응)
 */
export const getImageUrl = (url: string | null | undefined) => {
  if (!url || url.trim() === '') return '/images/no-image.png';

  // 1. 이미 'http'로 시작하는 전체 URL인 경우 (Cloudinary 주소 등)
  if (url.startsWith('http')) {
    return url;
  }

  // 2. 대참사 방지: '/uploads/https://...' 처럼 경로가 꼬여서 들어온 경우 처리
  // 문자열 안에 'https://'가 포함되어 있다면 그 지점부터 끝까지 잘라서 반환합니다.
  if (url.includes('https://')) {
    const startIndex = url.indexOf('https://');
    return url.substring(startIndex);
  }
  
  if (url.includes('http://')) {
    const startIndex = url.indexOf('http://');
    return url.substring(startIndex);
  }

  // 3. 기존 방식: 로컬 서버의 uploads 폴더 참조
  // API URL에서 마지막 슬래시를 제거하고 확실하게 '/uploads/'를 붙여줍니다.
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  
  // 파일명 앞에 이미 '/'가 붙어있을 수 있으므로 정규식으로 중복 슬래시를 방지합니다.
  const cleanFileName = url.startsWith('/') ? url.substring(1) : url;
  
  return `${baseUrl}/uploads/${cleanFileName}`;
};