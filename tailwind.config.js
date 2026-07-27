/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#F5F2ED',
        surface: '#FFFFFF',
        border: '#E3DDD3',
        textPrimary: '#3D2B1F',
        textSecondary: '#7A6A5C',
        textMuted: '#A69A8E',

        accent: '#5C7A5A', // primary buttons: Charge, Start Shift, Save
        accentHover: '#4A6449',
        onAccent: '#FFFFFF',

        danger: '#B3261E',
        dangerBg: '#FBE9E7',
        warning: '#C77D2E',
        warningBg: '#FBF0E1',
        success: '#3E7A4B',
        successBg: '#E8F2E9',
      },
      fontFamily: {
        heading: ['Fraunces_600SemiBold'],
        body: ['Inter_400Regular'],
        bodyBold: ['Inter_700Bold'],
        bodySemiBold: ['Inter_600SemiBold'],
      },
    }, // Closes extend
  }, // Closes theme

  plugins: [],
}