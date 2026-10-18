import SurveyScreen from "./components/SurveyScreen";
import KakaoCallback from "./components/KakaoCallback";
import { KAKAO_CALLBACK_PATH } from "./auth/kakao";

function App() {
  // 화면이 두 개뿐이라 라우터 없이 주소로만 나눈다
  if (window.location.pathname === KAKAO_CALLBACK_PATH) {
    return <KakaoCallback />;
  }
  return (
    <div className="w-full h-full">
      <SurveyScreen />
    </div>
  );
}

export default App;
