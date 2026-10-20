/** Small transient message, shared by every page. */
let timer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  let el = document.querySelector<HTMLDivElement>(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => el!.classList.remove("show"), 1800);
}
