import styles from "./EnvelopeCover.module.css";

function Flourish() {
  return (
    <svg viewBox="0 0 104 34" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <defs>
        <g id="cover-sprig">
          <path d="M50 29Q28 26 5 9M14 15Q8 15 4 21Q12 21 16 17M21 19Q18 8 11 6Q11 14 21 19M27 22Q20 22 17 28Q25 28 30 23M33 25Q31 14 24 12Q25 20 33 25M40 27Q35 28 32 33Q39 33 44 28" />
        </g>
      </defs>
      <use href="#cover-sprig" /><use href="#cover-sprig" transform="translate(104) scale(-1 1)" />
      <path d="M52 27Q45 21 49 16Q52 13 55 16Q59 21 52 27ZM52 14V5m0 5-4-4m4 2 4-5" />
    </svg>
  );
}

function Flap() {
  return (
    <svg className={styles.flap} viewBox="0 0 600 225" aria-hidden="true">
      <defs>
        <linearGradient id="flap-paper" x2=".72" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#695046" /><stop offset=".5" stopColor="#584138" /><stop offset="1" stopColor="#493730" />
        </linearGradient>
        <pattern id="lace" width="24" height="23" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#f0d8b3" strokeWidth=".95">
            <path d="M0 5Q12 30 24 5M0 5Q12 25 24 5M1 5Q11 4 12 16Q13 4 23 5M8 6Q12 -2 16 6Q12 12 8 6Z" />
            <path d="M0 8Q3 17 7 16Q8 23 12 20Q16 23 17 16Q21 17 24 8" strokeWidth=".7" />
          </g>
        </pattern>
        <g id="embroidered-edge">
          <path fill="url(#lace)" d="M0 0h360v23H0z" />
          <path d="M0 0H360M0 3H360" stroke="#eed7b6" strokeWidth=".9" />
        </g>
        <clipPath id="flap-outline"><path d="M0 0H600L312 202Q300 211 288 202Z" /></clipPath>
      </defs>
      <g clipPath="url(#flap-outline)">
        <path d="M0 0H600V225H0Z" fill="url(#flap-paper)" />
        <use href="#embroidered-edge" transform="translate(-2 -24) rotate(35)" />
        <use href="#embroidered-edge" transform="translate(602 -24) scale(-1 1) rotate(35)" />
        <path d="M0 0L291 202Q300 209 309 202L600 0" fill="none" stroke="#795947" strokeWidth="2" />
      </g>
    </svg>
  );
}

export default function EnvelopeCover({ opening, onOpen }: { opening: boolean; onOpen: () => void }) {
  return (
    <section className={styles.cover} data-opening={opening} aria-labelledby="cover-names">
      <div className={styles.frame}>
        <header className={styles.dateline}><span>Bauan, Batangas</span><span>30 January 2027</span></header>
        <div className={styles.center}>
          <span className={styles.ornament}><Flourish /></span>
          <p className={styles.kicker}>A wedding invitation from</p>
          <h2 id="cover-names" className={styles.names}>Adrian <i>&amp;</i> KC</h2>
          <button className={styles.trigger} type="button" onClick={onOpen} aria-label="Open invitation to the wedding of Adrian and KC">
            <span className={styles.envelope} aria-hidden="true">
              <span className={styles.letter}>
                <span>You're invited</span>
                <img src="/monogram.webp" width="360" height="240" alt="" />
              </span>
              <svg className={styles.pocket} viewBox="0 0 600 340">
                <defs>
                  <linearGradient id="side-paper" x2="1" y2=".8"><stop stopColor="#4a362d"/><stop offset=".5" stopColor="#60473b"/><stop offset="1" stopColor="#47342c"/></linearGradient>
                  <linearGradient id="front-paper" x2=".22" y2="1"><stop stopColor="#563f35"/><stop offset="1" stopColor="#493730"/></linearGradient>
                </defs>
                <path d="M0 0L300 206L600 0V340H0Z" fill="url(#side-paper)"/>
                <path d="M0 340L277 155Q300 140 323 155L600 340Z" fill="url(#front-paper)" stroke="#453129"/>
                <path d="M3 340L279 157Q300 143 321 157L597 340" fill="none" stroke="#72574a" strokeWidth="1.3"/>
              </svg>
              <span className={styles.lid}>
                <Flap />
                <span className={styles.seal}>
                  <img src="/monogram.webp" width="360" height="240" alt="" />
                </span>
              </span>
            </span>
            <span className={styles.prompt}>Open the invitation <span aria-hidden="true">→</span></span>
          </button>
        </div>
        <div className={styles.footer} aria-hidden="true"><span/>✧<span/></div>
      </div>
    </section>
  );
}
