import SurveyScreen from "./components/SurveyScreen";

function App() {
  return (
    <div className="w-full h-full">
       {/* 나중에는 라우터(Router)를 써서 메인/설문/결과 페이지를 나눌 겁니다. */}
       {/* 지금은 설문 화면만 바로 보여줍시다. */}
      <SurveyScreen />
    </div>
  );
}

export default App;