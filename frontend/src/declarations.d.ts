// Tells TypeScript that importing raw style files is completely valid
declare module '*.css' {
  const content: any;
  export default content;
}
