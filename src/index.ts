import {
  Document,
  Paragraph,
  ImageRun,
  TextRun,
  Packer,
} from "docx";
import * as cheerio from 'cheerio';
import * as fs from "fs";
import axios from "axios";
import {
  findTextAndReturnRemainder,
  getTextInHtmlTag,
  downloadImage,
} from "./utils";

class MPTODOCX {
  private readonly url: string = "";
  private articleJsonData: any;
  private textArray: Array<Paragraph> = [];
  private imageArray: Array<ImageRun> = [];
  private paragraphArray: Array<Paragraph> = [];

  constructor(url: string) {
    this.url = url;
  }

  async getMpHtml() {
    const result = await axios.get(this.url);
    return result.data;
  }

  async getArticleJsonData() {
    const html = await this.getMpHtml();
    const $ = cheerio.load(html);
    const strData = findTextAndReturnRemainder(
      $("script").text(),
      "var ARTICLE_DETAIL = ",
      "var detail = ",
    );
    return JSON.parse(strData);
  }
  async setArticleJsonData() {
    this.articleJsonData = await this.getArticleJsonData();
  }

  setTextArray() {
    for (let content of this.articleJsonData.content) {
      if (content.text) {
        this.textArray.push(
          new Paragraph({
            children: [new TextRun(getTextInHtmlTag(content.text))],
            style: "GWP",
          })
        );
      }
    }
  }

  createTitle() {
    this.textArray.push(new Paragraph({
      children: [new TextRun(this.articleJsonData.article.title)],
      style: "GWH",
    }));
  }

  async setImageArray() {
    for (let content of this.articleJsonData.content) {
      if (content.img_url) {
        this.imageArray.push(new ImageRun({
          data: await downloadImage(content.img_url),
          transformation: {
            width: 200,
            height: 200,
          },
        }));
      }
    }
  }

  async setParagraphArray() {
    this.createTitle();
    this.setTextArray();
    await this.setImageArray();
    this.paragraphArray = this.textArray.concat(new Paragraph({
      children: this.imageArray,
    }));
  }

  async createDocument() {
    await this.setParagraphArray();
    const docx = new Document({
      externalStyles: fs.readFileSync("static/styles.xml", "utf-8"),
      sections: [{
        properties: {
          page: {
            margin: {
              top: "3cm",
              bottom: "2.5cm",
              right: "2.5cm",
              left: "2.5cm",
            },
          },
        },
        children: this.paragraphArray,
      }],
    });
    Packer.toBuffer(docx).then((buffer) => {
      fs.writeFileSync(`static/${this.articleJsonData.article.title}.docx`, buffer);
    })
  }

  async start() {
    await this.setArticleJsonData();
    await this.createDocument();
  }
}

const mp = new MPTODOCX("https://www.meipian.cn/4k91m6tc");
mp.start()
