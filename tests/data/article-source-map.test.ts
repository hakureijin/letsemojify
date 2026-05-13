import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const pagePath = join(
  process.cwd(),
  "article",
  "article_vinci2026_fourpart_source_map.html",
);

describe("article source map page", () => {
  const readHtml = () => readFileSync(pagePath, "utf8");

  const readSentenceProvenance = () => {
    const html = readHtml();
    const match = html.match(
      /<script type="application\/json" id="sentence-provenance-data">\n([\s\S]*?)\n    <\/script>/,
    );
    expect(match).not.toBeNull();
    return JSON.parse(match?.[1] ?? "{}") as {
      summary: {
        totalSentences: number;
        fromArticle: number;
        mixed: number;
        new: number;
      };
      sentences: Array<{
        status: "source" | "mixed" | "new";
        sourceSection: string | null;
        externalSources: Array<{ url: string }>;
      }>;
    };
  };

  test("visualizes the four-part draft against the source article sections", () => {
    const html = readHtml();

    [
      "1 INTRODUCTION",
      "2 HISTORICAL REVIEW OF EMOTICONS AND EMOJI",
      "3 CONTEMPORARY EMOJI SELECTION STANDARDS",
      "4 CHANGING USAGE HABITS",
      "5 CREATIVE APPLICATIONS AND FUTURES OF EMOJI",
      "6 CONCLUSION",
    ].forEach((heading) => {
      expect(html).toContain(heading);
    });

    [
      "1 Introduction: The Role of Emojis in Online Culture and Social Expression",
      "2 The Emergence of Early Emoticons",
      "3 The Development of Emoji Systems",
      "4 Emojis as Tools for Digital Communication",
      "5 The Future of Emojis in Communication Design",
      "6 Conclusion",
    ].forEach((sourceSection) => {
      expect(html).toContain(sourceSection);
    });

    expect(html).toContain("新增补充");
  });

  test("includes sentence-level provenance with original subsections and external sources", () => {
    const html = readHtml();

    expect(html).toContain("句子级溯源");
    expect(html).toContain("sentence-provenance-data");
    expect(html).toContain("article.docx > 2.1 History");
    expect(html).toContain("article.docx > 4.2.2 Multicultural Social Context");
    expect(html).toContain("https://www.unicode.org/reports/tr51/proposed.html");
    expect(html).toContain("https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/");
  });

  test("keeps sentence-level new content tied to concrete websites", () => {
    const data = readSentenceProvenance();

    expect(data.summary.totalSentences).toBeGreaterThan(200);
    expect(data.summary.fromArticle).toBeGreaterThan(150);
    expect(data.summary.mixed).toBeGreaterThan(20);
    expect(data.summary.new).toBeGreaterThan(0);

    const newItems = data.sentences.filter((item) => item.status === "new");
    expect(newItems.length).toBe(data.summary.new);
    newItems.forEach((item) => {
      expect(item.sourceSection).toBeNull();
      expect(item.externalSources.length).toBeGreaterThan(0);
      item.externalSources.forEach((source) => {
        expect(source.url).toMatch(/^https?:\/\//);
      });
    });
  });
});
