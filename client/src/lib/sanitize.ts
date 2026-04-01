import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML to prevent XSS when using dangerouslySetInnerHTML.
 * Allows safe formatting tags (mark, b, i, em, strong, span) used by
 * search highlighting and text formatting features.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "mark", "b", "i", "em", "strong", "span", "br",
      "p", "div", "ul", "ol", "li", "a", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote",
      "table", "thead", "tbody", "tr", "th", "td",
      "img", "svg", "path", "g", "rect", "circle", "line", "text",
      "defs", "clipPath", "use", "symbol", "polyline", "polygon",
    ],
    ALLOWED_ATTR: [
      "class", "style", "href", "target", "rel", "src", "alt",
      "width", "height", "viewBox", "xmlns", "fill", "stroke",
      "stroke-width", "d", "cx", "cy", "r", "x", "y",
      "x1", "y1", "x2", "y2", "points", "transform",
      "id", "clip-path", "xlink:href",
    ],
  });
}
