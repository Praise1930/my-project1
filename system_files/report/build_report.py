"""Rebuild system_report.html by inlining the diagram PNGs into _template.html.

The report has to be a single self-contained file (the artifact host blocks
external requests), so each figure is downscaled, re-encoded as WebP, and
embedded as a data URI in place of its {{FIGnn}} placeholder.

    python report/build_report.py
"""

import base64
import io
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DIAGRAMS = os.path.join(HERE, "diagrams")

FIGURES = {
    "FIG01": "fig01_system_architecture.png",
    "FIG02": "fig02_module_architecture.png",
    "FIG03": "fig03_context_diagram.png",
    "FIG04": "fig04_dfd_level0.png",
    "FIG05": "fig05_dfd_level1.png",
    "FIG06": "fig06_er_diagram.png",
    "FIG07": "fig07_use_case.png",
    "FIG08": "fig08_state_machine.png",
    "FIG09": "fig09_sequence.png",
    "FIG10": "fig10_offline_sync.png",
}

MAX_WIDTH = 1700  # wide enough to stay readable when zoomed, small enough to embed


def encode(path: str) -> str:
    image = Image.open(path).convert("RGB")
    if image.width > MAX_WIDTH:
        height = int(image.height * MAX_WIDTH / image.width)
        image = image.resize((MAX_WIDTH, height), Image.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, "WEBP", quality=88, method=5)
    return base64.b64encode(buffer.getvalue()).decode()


def main() -> None:
    with open(os.path.join(HERE, "_template.html"), encoding="utf-8") as handle:
        html = handle.read()

    for key, filename in FIGURES.items():
        alt = filename.split("_", 1)[1].rsplit(".", 1)[0].replace("_", " ")
        data = encode(os.path.join(DIAGRAMS, filename))
        html = html.replace(
            "{{%s}}" % key,
            '<img src="data:image/webp;base64,%s" alt="%s">' % (data, alt),
        )

    if "{{" in html:
        raise SystemExit("unfilled placeholder left in template")

    out = os.path.join(HERE, "system_report.html")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(html)

    print("wrote %s (%.2f MB)" % (out, os.path.getsize(out) / 1e6))


if __name__ == "__main__":
    main()
