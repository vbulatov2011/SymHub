import {
    SymSimOne,
    GrayScottSimulationCreator,
    Group_KLMN,

}
from './modules.js';

import {
    gray_scott_samples_klmn
}
from './gray_scott_samples_klmn.js';

try {
    let ss = SymSimOne({
        simCreator: GrayScottSimulationCreator,
        samples: gray_scott_samples_klmn,
        groupMaker:  new Group_KLMN({}), // maker of the groups
    });
    ss.run();

} catch (err) {
    console.error('error: ', err);
}