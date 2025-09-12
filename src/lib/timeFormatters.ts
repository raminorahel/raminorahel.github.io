// Format date for display based on language
export function formatDate(
  date: {
    toLocaleDateString: (
      arg0: string,
      arg1: { year: string; month: string; day: string }
    ) => any;
  },
  language = "en"
) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleDateString(
    language === "fa" ? "fa-IR" : "en-US",
    options
  );
}
