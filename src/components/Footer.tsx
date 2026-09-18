import { HOMES_HASH } from "../lib/route.ts";
import { Wordmark } from "./Wordmark.tsx";

const PHONE = "+61 490 465 855";
const EMAIL = "phillipislandcohost@gmail.com";

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-top">
          <div>
            <a href="#top" className="logo">
              <Wordmark showBoth={false} />
            </a>
            <p className="ft-blurb">
              A local, full-service hosting company caring for holiday homes across Phillip Island and San Remo.
            </p>
          </div>
          <div>
            <h4>Stay</h4>
            <ul>
              <li>
                <a href={HOMES_HASH}>All homes</a>
              </li>
              <li>
                <a href={HOMES_HASH}>Cowes</a>
              </li>
              <li>
                <a href={HOMES_HASH}>Newhaven</a>
              </li>
              <li>
                <a href={HOMES_HASH}>Cape Woolamai</a>
              </li>
              <li>
                <a href="#guide">Island guide</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#story">About us</a>
              </li>
              <li>
                <a href="#owners">For owners</a>
              </li>
              <li>
                <a href="#included">What's included</a>
              </li>
              <li>
                <a href="https://www.pilaundromat.com/" target="_blank" rel="noopener noreferrer">
                  Island Laundromat
                </a>
              </li>
              <li>
                <a href="#included">24/7 Gym</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>
                <a href="tel:+61490465855">{PHONE}</a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </li>
              <li>
                <a href="#stays">Cowes, Phillip Island VIC 3922</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="ft-bot">
          <span>© {new Date().getFullYear()} Phillip Island Host. All rights reserved.</span>
          <span>
            <a href="#top">Privacy</a> &nbsp;·&nbsp; <a href="#top">Terms</a> &nbsp;·&nbsp; <a href="#top">House rules</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
