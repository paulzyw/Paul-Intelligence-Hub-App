async function check() {
  try {
    const res = await fetch("http://127.0.0.1:3000/");
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Text length:", text.length, "includes root:", text.includes("root"));
  } catch (err) {
    console.error("Error:", err);
  }
}
check();
