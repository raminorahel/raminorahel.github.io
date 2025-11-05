class MkUrl {
  domain: string;
  ssl: boolean;

  constructor(domain: string, ssl: boolean = true) {
    this.domain = domain;
    this.ssl = ssl;
  }

  build(name: string): string {
    return `http${this.ssl ? "s" : ""}://${name ? name + "." : ""}${
      this.domain
    }/`.toLowerCase();
  }
}

export default MkUrl;
