// 사용 가능한 색상 목록
const predefinedColors = [
    "indigo",
    "cyan", 
    "zinc",
    "purple",
    "yellow",
    "red",
    "lime",
    "pink",
    "emerald",
    "teal",
    "fuchsia",
    "sky",
    "blue",
    "orange",
    "violet",
    "rose",
    "green",
    "amber",
    "slate",
    "gray",
    "neutral",
    "stone"
  ];
  
  /**
   * 랜덤 색상을 반환하는 함수
   * @returns {string} 랜덤 색상명
   */
  export function getRandomColor() {
    return predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
  }
  
  /**
   * 카테고리 수에 맞는 색상 배열을 반환하는 함수
   * @param {string[]} categories - 카테고리 배열
   * @returns {string[]} 색상 배열
   */
  export function getColorsForCategories(categories) {
    // 카테고리 수가 미리 정의된 색상 수보다 적거나 같으면
    if (categories.length <= predefinedColors.length) {
      return predefinedColors.slice(0, categories.length);
    }
    
    // 카테고리 수가 더 많으면 랜덤 색상으로 채움
    const colors = [...predefinedColors]; // 복사본 생성
    
    while (colors.length < categories.length) {
      colors.push(getRandomColor());
    }
    
    return colors;
  }