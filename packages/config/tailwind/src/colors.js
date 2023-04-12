const colors = require("tailwindcss/colors")

delete colors["lightBlue"]
delete colors["warmGray"]
delete colors["trueGray"]
delete colors["coolGray"]
delete colors["blueGray"]

module.exports = {
  ...colors,
  primary: colors.orange,
  gray: {
    50: "#FAFAFA",
    75: "#EFEFEF",
    100: "#D9DADC",
    200: "#B5B7BA",
    300: "#919598",
    400: "#4A4F52",
    500: "#6D7275",
    600: "#373C3F",
    700: "#24282A",
    800: "#121516",
    900: "#010101",
  },
}
