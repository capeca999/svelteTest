// Dispara eventos cuando el nodo entra/sale del viewport
export function inview(
    node: Element,
    opts: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
    const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = opts;
    const io = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                node.dispatchEvent(new CustomEvent("enter"));
                if (once) io.unobserve(node);
            } else {
                node.dispatchEvent(new CustomEvent("leave"));
            }
        },
        { threshold, rootMargin }
    );
    io.observe(node);
    return {
        destroy() {
            io.disconnect();
        }
    };
}
