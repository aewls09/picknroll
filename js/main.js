document.addEventListener('DOMContentLoaded', () => {
  const hand = document.querySelector('.logo-hand');
  if (!hand) return;

  // 1) 초기에 drop + stretch 실행
  hand.classList.add('is-initial');

  // 초기 애니메이션이 끝나는 시간
  const INITIAL_DURATION = 5200; // (drop + stretchOnce 완료 추정치)

  setTimeout(() => {
    hand.classList.remove('is-initial');

    // 반복 애니메이션 실행 함수
    const playLoopAnimation = () => {
      hand.classList.remove('is-loop'); // 애니메이션 리셋
      void hand.offsetWidth;            // 강제 리플로우
      hand.classList.add('is-loop');    // stretch 1회 재생
    };

    // 즉시 한 번 실행
    playLoopAnimation();

    // 이후 3초마다 반복
    setInterval(playLoopAnimation, 3000);

  }, INITIAL_DURATION);
});

