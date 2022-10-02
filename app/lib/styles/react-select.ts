import type { StylesConfig } from "react-select"
import type { Theme } from "@chakra-ui/react"

export const customSelectStyle = (
  theme: Theme,
  hasError: boolean,
  isDark: boolean,
): StylesConfig<any, any> => ({
  container: (styles) => ({
    ...styles,
    paddingTop: 0,
    paddingBottom: 0,
    width: "100%",
  }),
  control: (styles, state) => ({
    ...styles,
    minHeight: "32px",
    borderRadius: 2,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
    boxShadow: hasError
      ? `inset 0px 0px 0px 2px ${theme.colors.red[500]}`
      : state.isFocused
      ? `inset 0px 0px 0px 2px ${theme.colors.orange[500]}`
      : `inset 0px 0px 0px 1px ${isDark ? theme.colors.gray[400] : theme.colors.gray[200]}`,
    backgroundColor: "transparent",
    ":hover": {
      boxShadow: state.isFocused
        ? `inset 0px 0px 0px 2px ${theme.colors.orange[500]}`
        : `inset 0px 0px 0px 1px ${isDark ? theme.colors.gray[500] : theme.colors.gray[300]}`,
    },
  }),
  menu: (styles) => ({
    ...styles,
    paddingTop: 0,
    zIndex: 100,
    paddingBottom: 0,
    backgroundColor: isDark ? theme.colors.gray[900] : theme.colors.gray[50],
  }),
  input: (styles) => ({
    ...styles,
    paddingTop: 0,
    fontSize: theme.fontSizes.sm,
    paddingBottom: 0,
    paddingLeft: 3,
    color: isDark ? "white" : "black",
  }),
  singleValue: (styles) => ({ ...styles, fontSize: theme.fontSizes.sm, color: isDark ? "white" : "black" }),
  placeholder: (styles) => ({
    ...styles,
    overflow: "hidden",
    whiteSpace: "nowrap",
    paddingVertical: 0,
    paddingLeft: 3,
    fontSize: theme.fontSizes.sm,
    color: isDark ? "white" : "black",
  }),
  option: (styles, state) => ({
    ...styles,
    paddingVertical: 0,
    textAlign: "left",
    fontWeight: state.isSelected ? theme.fontWeights.medium : "normal",
    fontSize: theme.fontSizes.sm,
    color: isDark ? theme.colors.gray[100] : theme.colors.gray[900],
    backgroundColor: state.isFocused
      ? isDark
        ? theme.colors.gray[700]
        : theme.colors.gray[100]
      : state.isSelected
      ? isDark
        ? theme.colors.gray[800]
        : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          theme.colors.gray[75]
      : "transparent",
    ":hover": {
      backgroundColor: isDark ? theme.colors.gray[800] : theme.colors.gray[100],
    },
  }),
  indicatorsContainer: (styles) => ({
    ...styles,
    padding: 0,
    marginRight: 10,
  }),
  clearIndicator: (styles) => ({
    ...styles,
    padding: 0,
    "& > svg": { height: 16 },
    color: isDark ? theme.colors.gray[200] : theme.colors.gray[600],
    ":hover": {
      color: isDark ? theme.colors.gray[400] : theme.colors.gray[300],
    },
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    padding: 0,
    "& > svg": { height: 16 },
    color: isDark ? theme.colors.gray[200] : theme.colors.gray[600],
    ":hover": {
      color: isDark ? theme.colors.gray[400] : theme.colors.gray[300],
    },
  }),
  indicatorSeparator: (styles) => ({
    ...styles,
    backgroundColor: "transparent",
  }),
  multiValue: (styles) => ({
    ...styles,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 2,
    paddingRight: 3,
    backgroundColor: isDark ? theme.colors.gray[800] : theme.colors.gray[100],
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    color: isDark ? "white" : "black",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    height: "18px",
    width: "18px",
    borderRadius: 1,
  }),
})
