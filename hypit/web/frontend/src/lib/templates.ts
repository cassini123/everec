import type { TemplatePack } from "../types";
import { serializeWorkflow } from "./workflow";

export const TEMPLATES: TemplatePack[] = [
  {
    id: "ranking-goat",
    name: "GOAT DEBATE",
    kind: "ranking",
    tag: "UGC 排行",
    cost: "结构可复用",
    description:
      "20 秒足球梯队榜。S 放 Messi、D 放 Ronaldo。词对齐字幕 + 色块 karaoke + 排行板动画。",
    source: serializeWorkflow({
      id: "ranking-goat",
      title: "GOAT DEBATE",
      kind: "ranking",
      format: "9:16",
      duration: 20,
      hook: "Who is the GOAT?",
      host: "street-host",
      language: "en",
      music: "trap-hook",
      narration: [
        "Who is the GOAT?",
        "Messi belongs in S.",
        "Ronaldo belongs in D.",
      ],
      ranks: [
        { tier: "S", label: "Messi" },
        { tier: "A", label: "Neymar" },
        { tier: "B", label: "Mbappé" },
        { tier: "D", label: "Ronaldo" },
      ],
      reveals: [],
      broll: ["crowd roar", "trophy flash", "banana-cat reaction"],
    }),
    variants: [
      {
        id: "banana-cat",
        name: "换主持 · Banana Cat",
        blurb: "旁白换成香蕉猫，榜单结构不动。",
        patch: { host: "banana-cat", hook: "MEOW IS THE GOAT?" },
      },
      {
        id: "ronaldo-goat",
        name: "翻盘 · Ronaldo S",
        blurb: "翻转排名，Ronaldo 进 S，Messi 进 D。",
        patch: {
          hook: "SIUUU is the answer",
          narration: [
            "Who is the GOAT?",
            "Ronaldo belongs in S.",
            "Messi belongs in D.",
          ],
          ranks: [
            { tier: "S", label: "Ronaldo" },
            { tier: "A", label: "Mbappé" },
            { tier: "B", label: "Neymar" },
            { tier: "D", label: "Messi" },
          ],
        },
      },
      {
        id: "founders",
        name: "换题材 · 科技创始人",
        blurb: "同一病毒结构，球员换成创始人。",
        patch: {
          title: "FOUNDER GOAT",
          hook: "Who built the future?",
          host: "tech-bro",
          narration: [
            "Who is the founder GOAT?",
            "Jobs belongs in S.",
            "The rest can fight for scraps.",
          ],
          ranks: [
            { tier: "S", label: "Jobs" },
            { tier: "A", label: "Musk" },
            { tier: "B", label: "Altman" },
            { tier: "D", label: "SBF" },
          ],
          broll: ["keynote stage", "rocket launch", "terminal scroll"],
        },
      },
    ],
  },
  {
    id: "podcast-creatine",
    name: "DAILY CREATINE",
    kind: "podcast",
    tag: "播客切片",
    cost: "结构可复用",
    description:
      "18 秒对峙切片。分屏访谈、说话人着色字幕、产品交接瞬间。",
    source: serializeWorkflow({
      id: "podcast-creatine",
      title: "DAILY CREATINE",
      kind: "podcast",
      format: "9:16",
      duration: 18,
      hook: "You skip creatine?",
      host: "muscle-barbie",
      hostB: "college-kid",
      product: "creatine",
      language: "en",
      music: "podcast-bed",
      narration: [
        "You skip creatine?",
        "That's why you look like a wet paper bag.",
        "Take the scoop. Now.",
      ],
      ranks: [],
      reveals: ["handoff", "lifestyle b-roll"],
      broll: ["gym montage", "protein scoop", "mirror flex"],
    }),
    variants: [
      {
        id: "pepe-doge",
        name: "换主持 · Pepe vs Doge",
        blurb: "两边主持换成 meme，还是同一套对峙结构。",
        patch: {
          host: "pepe",
          hostB: "doge",
          product: "doggy-arms",
          hook: "You skip doggy arms?",
          narration: [
            "You skip doggy arms day?",
            "That's why your biceps are sad.",
            "Take the scoop. Now.",
          ],
        },
      },
      {
        id: "retinol",
        name: "换产品 · 视黄醇",
        blurb: "肌酸换成视黄醇，对峙变成护肤吐槽。",
        patch: {
          title: "DAILY RETINOL",
          product: "retinol",
          host: "pretty-boy",
          hostB: "tomboy",
          hook: "You skip retinol?",
          narration: [
            "You skip retinol?",
            "That's why your pores look like craters.",
            "Apply the serum. Now.",
          ],
        },
      },
      {
        id: "cheatgpt",
        name: "换产品 · CheatGPT",
        blurb: "实体产品换成 App，GPA 对峙。",
        patch: {
          title: "CHEAT GPT",
          product: "CheatGPT",
          host: "himbo-jock",
          hostB: "phd-student",
          hook: "You still write essays?",
          narration: [
            "You still write essays?",
            "That's why my GPA cooks yours.",
            "Open CheatGPT. Now.",
          ],
        },
      },
    ],
  },
  {
    id: "interview-ride",
    name: "NICE RIDE",
    kind: "interview",
    tag: "街头采访",
    cost: "结构可复用",
    description:
      "26 秒街头采访。三规则揭晓板、说话人着色字幕、声音同步 emoji。",
    source: serializeWorkflow({
      id: "interview-ride",
      title: "NICE RIDE",
      kind: "interview",
      format: "9:16",
      duration: 26,
      hook: "Three rules for the first million",
      host: "mob-wife",
      product: "Lambo",
      language: "en",
      music: "bass-drop",
      narration: [
        "Nice ride. How did you make your first million?",
        "Rule one: never explain.",
        "Rule two: always collect.",
        "Rule three: leave first.",
      ],
      ranks: [],
      reveals: ["Never explain", "Always collect", "Leave first"],
      broll: ["car pan", "gold flash", "city night"],
    }),
    variants: [
      {
        id: "wojak-chad",
        name: "换主持 · Wojak / Chad",
        blurb: "主持换成 Wojak 问、Chad 答。",
        patch: { host: "chad", hostB: "wojak", hook: "Bro how did you print money?" },
      },
      {
        id: "spanish",
        name: "本地化 · Español",
        blurb: "同一套 punchline，整段翻成西语，时间轴自动回流。",
        patch: {
          language: "es",
          hook: "Tres reglas para el primer millón",
          narration: [
            "Bonito auto. ¿Cómo hiciste tu primer millón?",
            "Regla uno: nunca expliques.",
            "Regla dos: siempre cobra.",
            "Regla tres: vete primero.",
          ],
          reveals: ["Nunca expliques", "Siempre cobra", "Vete primero"],
        },
      },
      {
        id: "f1",
        name: "换道具 · F1",
        blurb: "Lambo 换成 F1，故事换成误打误撞进大奖赛。",
        patch: {
          title: "NICE WING",
          product: "F1",
          host: "ada",
          hostB: "leon",
          hook: "Uber to Grand Prix",
          narration: [
            "Nice wing. How did Uber become a Grand Prix?",
            "Rule one: never miss a pickup.",
            "Rule two: always take the racing line.",
            "Rule three: leave the airport first.",
          ],
          reveals: ["Never miss a pickup", "Take the racing line", "Leave first"],
          broll: ["pit lane", "helmet visor", "checkered flag"],
        },
      },
    ],
  },
];

export function templateById(id: string): TemplatePack | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
