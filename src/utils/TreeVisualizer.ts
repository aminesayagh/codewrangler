import { Directory } from "../models/Directory";
import { File } from "../models/File";
import { Document } from "../models/Document";
import path from "path";
import * as fs from "fs/promises";

export class TreeVisualizer {
  static async generateTree(files: string[], rootDir: string): Promise<string> {
    const root = new Directory(path.basename(rootDir), rootDir);
    await this.buildTree(root, files, rootDir);
    return this.generateTreeString(root, "");
  }

  private static async buildTree(
    root: Directory,
    files: string[],
    rootDir: string
  ): Promise<void> {
    for (const file of files) {
      const relativePath = path.relative(rootDir, file);
      const parts = relativePath.split(path.sep);
      let currentDir = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i] as string;
        if (i === parts.length - 1) {
          // It's a file
          const stats = await fs.stat(file);
          const newFile = new File(part, file, stats.size);
          await currentDir.addChild(newFile);
        } else {
          // It's a directory
          let child = currentDir.children.find(
            (c) => c.name === part
          ) as Directory;
          if (!child) {
            child = new Directory(part, path.join(currentDir.path, part));
            await currentDir.addChild(child);
          }
          currentDir = child;
        }
      }
    }
  }

  private static generateTreeString(node: Document, prefix: string): string {
    let result = `${prefix}${node.getInfo()}\n`;

    if (node instanceof Directory) {
      const childrenPrefix = prefix + "│   ";
      const lastChildPrefix = prefix + "    ";

      node.children.forEach((child, index) => {
        const isLastChild = index === node.children.length - 1;
        const childPrefix = isLastChild ? "└── " : "├── ";
        const newPrefix = isLastChild ? lastChildPrefix : childrenPrefix;

        result += `${prefix}${childPrefix}${this.generateTreeString(
          child,
          newPrefix
        )}`;
      });
    }

    return result;
  }
}
