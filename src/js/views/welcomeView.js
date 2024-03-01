import { ColorLog } from "../utils";
import * as MARKUP from "../views/viewMarkUp";

export const buildWelcomeView = function (welcomePage, pageMenu, data) {
  if (welcomePage.built) return;

  ColorLog("Building Welcome View", "FFA500");

  const welcomeDom = welcomePage.element;

  welcomeDom.insertAdjacentHTML(
    "beforeend",
    `<div class="container left-align font_text p-5"></div>`
  );
  const welcomeContainer = welcomeDom.lastChild;
  welcomeContainer.insertAdjacentHTML(
    "beforeend",
    MARKUP.h4(
      `${MARKUP.span("")} ${data.info.name}/${data.info.alias}`,
      0,
      0,
      "",
      "color_text"
    )
  );
  welcomeContainer.insertAdjacentHTML(
    "beforeend",
    MARKUP.container(0, 0, "solid_l p-3")
  );
  const textContainer = welcomeContainer.lastChild;

  textContainer.insertAdjacentHTML(
    "beforeend",
    MARKUP.h5(`Oh, hey there and welcome`, 0, 0, "mb-3")
  );
  textContainer.insertAdjacentHTML(
    "beforeend",
    MARKUP.h5(`>_`, 0, 0, "mb-3 color_foreground")
  );
  textContainer.insertAdjacentHTML(
    "beforeend",
    MARKUP.h5(
      `I am a Software Engineer, Indie Developer and owner of ${MARKUP.span(
        "Yurluin",
        0,
        0,
        "",
        "color_text"
      )}, my solo studio label. My daily drive is to create fun and interesting patterns.`,
      0,
      0,
      ""
    )
  );

  welcomePage.built = true;
};
