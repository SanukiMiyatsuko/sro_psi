export type T = ZT | PT | AT;
export type ZT = { readonly type: "zero" };
export type AT = { readonly type: "plus", readonly add: PT[] };
export type PT = PTM | PTP;
export type PTM = { readonly type: "mahlo", readonly arg: T };
export type PTP = { readonly type: "psi", readonly sub: T, readonly arg: T };

export const Z: ZT = { type: "zero" };
export const ONE: PTP = { type: "psi", sub: Z, arg: Z };
export const OMEGA: PTP = { type: "psi", sub: Z, arg: ONE };
export const LOMEGA: PTP = { type: "psi", sub: ONE, arg: Z };
export const MAHLO: PT = { type: "mahlo", arg: Z };
export const IOTA: PTP = { type: "psi", sub: MAHLO, arg: Z };

export function psi(sub: T,arg: T): PTP {
    return { type: "psi", sub: sub, arg: arg };
}

export function mahlo(arg: T): PT {
    return { type: "mahlo", arg: arg };
}

export function sanitize_plus_term(add: PT[]): PT | AT {
    if (add.length === 1) return add[0];
    return { type: "plus", add: add };
}

export function plus(s: T,t: T): T {
    if (s.type === "zero") return t;
    if (s.type === "plus") {
        if (t.type === "zero") return s;
        if (t.type === "plus")
            return { type: "plus", add: [...s.add, ...t.add] };
        return { type: "plus", add: [...s.add, t] };
    } else {
        if (t.type === "zero") return s;
        if (t.type === "plus")
            return { type: "plus", add: [s, ...t.add] };
        return { type: "plus", add: [s, t] };
    }
}

export function eq(s: T,t: T): boolean {
    if (t.type === "zero") return s.type === "zero";
    if (s.type === "zero") return false;
    if (s.type === "plus") {
        if (t.type !== "plus") return false;
        return s.add.every((x,i) => eq(x,t.add[i]));
    } else if (s.type === "mahlo") {
        if (t.type !== "mahlo") return false;
        return eq(s.arg,t.arg);
    } else {
        if (t.type !== "psi") return false;
        return eq(s.sub,t.sub) && eq(s.arg,t.arg);
    }
}

function le(s: T,t: T): boolean {
    if (eq(s,t)) return true;
    return lt(s,t);
}

export function lt(s: T,t: T): boolean {
    if (t.type === "zero") return false;
    if (s.type === "zero") return true;
    if (s.type === "plus") {
        const s0 = s.add[0];
        if (t.type === "plus") {
            const s1 = sanitize_plus_term(s.add.slice(1));
            const t0 = t.add[0];
            const t1 = sanitize_plus_term(t.add.slice(1));
            return lt(s0, t0) || (eq(s0, t0) && lt(s1, t1));
        }
        return lt(s0, t);
    } else if (s.type === "mahlo") {
        if (t.type === "plus")
            return le(s,t.add[0]);
        if (t.type === "mahlo")
            return lt(s.arg,t.arg);
        return false;
    } else {
        if (t.type === "plus")
            return le(s,t.add[0]);
        if (t.type === "mahlo")
            return true;
        const s0 = s.sub;
        const t0 = t.sub;
        return lt(s0, t0) || (eq(s0, t0) && lt(s.arg, t.arg));
    }
}

export function dom(s: T): ZT | PT {
    if (s.type === "zero") return Z;
    if (s.type === "plus")
        return dom(s.add[s.add.length-1]);
    if (s.type === "mahlo") {
        const doma = dom(s.arg);
        if (doma.type === "zero") return s;
        if (eq(doma,ONE)) return OMEGA;
        return doma;
    } else {
        const domb = dom(s.arg);
        if (domb.type === "zero") {
            const doma = dom(s.sub);
            if (doma.type === "zero" || eq(doma,ONE))
                return s;
            else {
                if (le(doma,s)) return doma;
                else {
                    if (doma.type === "mahlo") return s;
                    return OMEGA;
                }
            }
        }
        if (eq(domb,ONE)) return OMEGA;
        else {
            if (le(domb,s)) return domb;
            return OMEGA;
        }
    }
}

function BP(s: T): T {
    if (s.type === "zero") return Z;
    if (s.type === "plus") {
        if (s.add[0].type === "psi") return s;
        return BP(sanitize_plus_term(s.add.slice(1)));
    }
    if (s.type === "mahlo") return BP(s.arg);
    return s;
}

export function fundAndGamma(a: T, b: T): {fund: T, gamma: T} {
    let bp: T = Z;
    // x[y]
    function fund(s: T, t: T): T {
        if (s.type === "zero") {
            return Z;
        } else if (s.type === "plus") {
            const lastfund = fund(s.add[s.add.length - 1], t);
            const remains = sanitize_plus_term(s.add.slice(0, s.add.length - 1));
            return plus(remains, lastfund);
        } else if (s.type === "mahlo") {
            const a = s.arg;
            const doma = dom(a);
            if (doma.type === "zero") return t;
            if (eq(doma,ONE)) {
                if (bp.type === "zero") bp = mahlo(fund(a,Z));
                if (eq(dom(t),ONE))
                    return plus(fund(t,Z),mahlo(fund(a,Z)));
                return Z;
            }
            return mahlo(fund(a,t));
        } else {
            const a = s.sub;
            const b = s.arg;
            const domb = dom(b);
            if (domb.type === "zero") {
                const doma = dom(a);
                if (doma.type === "zero" || eq(doma,ONE)) return t;
                else {
                    if (le(doma,s) || doma.type === "mahlo") return psi(fund(a,t),b);
                    else {
                        const c = doma.sub;
                        const domc = dom(c);
                        if (eq(domc,ONE)) {
                            if (bp.type === "zero") bp = psi(fund(c,Z),BP(fund(a,Z)));
                            if (eq(dom(t),ONE)) {
                                const p = fund(s,fund(t,Z));
                                if (p.type !== "psi") throw Error("なんでだよ");
                                const gamma = p.sub;
                                const bpg = BP(gamma);
                                if (bpg.type !== "psi") throw Error("型が許してくれない");
                                return psi(fund(a,psi(fund(c,Z),BP(gamma))),b);
                            }
                            return psi(fund(a,Z),b);
                        } else {
                            if (bp.type === "zero") bp = BP(fund(a,Z));
                            if (eq(dom(t),ONE)) {
                                const p = fund(s,fund(t,Z));
                                if (p.type !== "psi") throw Error("なんでだよ");
                                const gamma = p.sub;
                                return psi(fund(a,BP(gamma)),b);
                            }
                            return psi(fund(a,Z),b);
                        }
                    }
                }
            } else if (eq(domb,ONE)) {
                if (bp.type === "zero") bp = psi(a,fund(b,Z));
                if (eq(dom(t),ONE))
                    return plus(fund(t,Z),psi(a,fund(b,Z)));
                return Z;
            } else {
                if (le(domb,s)) return psi(a,fund(b,t));
                else {
                    if (domb.type !== "psi") throw Error("１変数目に入れるのはPTPだけなのでdom(b)は必ずPTP");
                    const c = domb.sub;
                    const domc = dom(c);
                    if (eq(domc,ONE)) {
                        if (bp.type === "zero") bp = psi(fund(c,Z),fund(b,Z));
                        if (eq(dom(t),ONE)) {
                            const p = fund(s,fund(t,Z));
                            if (p.type !== "psi") throw Error("なんでだよ");
                            const gamma = p.arg;
                            return psi(a,fund(b,psi(fund(c,Z),gamma)));
                        }
                        return psi(a,fund(b,Z));
                    } else {
                        if (bp.type === "zero") bp = fund(b,Z);
                        if (eq(dom(t),ONE)) {
                            const p = fund(s,fund(t,Z));
                            if (p.type !== "psi") throw Error("なんでだよ");
                            const gamma = p.arg;
                            return psi(a,fund(b,gamma));
                        }
                        return psi(a,fund(b,Z));
                    }
                }
            }
        }
    }

    return ({
        fund: fund(a, b),
        gamma: bp,
    });
}

export type Options = {
    checkOnOffo: boolean;
    checkOnOffO: boolean;
    checkOnOffI: boolean;
    checkOnOffA: boolean;
    checkOnOffB: boolean;
    checkOnOffC: boolean;
    checkOnOffT: boolean;
};

function to_TeX(str: string): string {
    str = str.replace(/ψ/g, "\\psi");
    str = str.replace(/M/g, "\\mathbb{M}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    str = str.replace(/I/g, "\\textrm{I}");
    return str;
}

function abbrviate(str: string, options: Options): string {
    str = str.replace(/ψ\(0\)/g, "1");
    str = str.replace(/ψ_\{0\}\(0\)/g, "1");
    str = str.replace(/ψ_0\(0\)/g, "1");
    str = str.replace(/ψ\(0,0\)/g, "1");
    if (options.checkOnOffo) {
        str = str.replace(/ψ\(1\)/g, "ω");
        str = str.replace(/ψ_\{0\}\(1\)/g, "ω");
        str = str.replace(/ψ_0\(1\)/g, "ω");
        str = str.replace(/ψ\(0,1\)/g, "ω");
    }
    if (options.checkOnOffO) {
        str = str.replace(/ψ_\{1\}\(0\)/g, "Ω");
        str = str.replace(/ψ_1\(0\)/g, "Ω");
        str = str.replace(/ψ\(1,0\)/g, "Ω");
    }
    if (options.checkOnOffI) {
        str = str.replace(/ψ_\{M\(0\)\}\(0\)/g, "I");
        str = str.replace(/ψ\(M\(0\),0\)/g, "I");
    }
    if (options.checkOnOffT) str = to_TeX(str);
    while (true) {
        const numterm = str.match(/1(\+1)+/);
        if (!numterm) break;
        const matches = numterm[0].match(/1/g);
        if (!matches) throw Error("そんなことある？");
        const count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    return str;
}

function term_to_string(t: T, options: Options): string {
    if (t.type === "zero") {
        return "0";
    } else if (t.type === "mahlo") {
        return `M(${term_to_string(t.arg, options)})`;
    } else if (t.type === "psi") {
        if (options.checkOnOffC && t.sub.type === "zero")
            return "ψ(" + term_to_string(t.arg, options) + ")";
        if (options.checkOnOffA) {
            if (options.checkOnOffB || options.checkOnOffT)
                return `ψ_{${term_to_string(t.sub, options)}}(${term_to_string(t.arg, options)})`;
            if (t.sub.type === "zero") {
                return `ψ_0(${term_to_string(t.arg, options)})`;
            } else if (t.sub.type === "plus") {
                if (t.sub.add.every((x) => eq(x, ONE)))
                    return `ψ_${term_to_string(t.sub, options)}(${term_to_string(t.arg, options)})`;
                return `ψ_{${term_to_string(t.sub, options)}}(${term_to_string(t.arg, options)})`;
            } else {
                if (eq(t.sub, ONE) || (options.checkOnOffo && eq(t.sub, OMEGA)) || (options.checkOnOffO && eq(t.sub, LOMEGA)) || (options.checkOnOffI && eq(t.sub, IOTA)))
                    return `ψ_${term_to_string(t.sub, options)}(${term_to_string(t.arg, options)})`;
                return `ψ_{${term_to_string(t.sub, options)}}(${term_to_string(t.arg, options)})`;
            }
        }
        return `ψ(${term_to_string(t.sub, options)},${term_to_string(t.arg, options)})`;
    } else {
        return t.add.map(x => term_to_string(x, options)).join("+");
    }
}

export function termToString(t: T, options: Options): string {
    return abbrviate(term_to_string(t, options), options);
}