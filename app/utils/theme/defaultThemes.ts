// themes.css should have 2 classes: .theme-{name} and .dark.theme-{name}
export const defaultTheme = "reddit-research";

// this array could be empty, it's only used by ThemeSelector
export const defaultThemes: { name: string; value: string }[] = [
  { name: "Reddit Research", value: "reddit-research" },
  { name: "Default", value: "zinc" },
  { name: "Slate", value: "slate" },
  { name: "Stone", value: "stone" },
  { name: "Gray", value: "gray" },
  { name: "Neutral", value: "neutral" },
  { name: "Red", value: "red" },
  { name: "Rose", value: "rose" },
  { name: "Orange", value: "orange" },
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Yellow", value: "yellow" },
  { name: "Violet", value: "violet" },
];
