import { FETCH_SURVEYS } from "../actions/types";

export default function(state = [], action) {
  switch (action.type) {
    case FETCH_SURVEYS:
      return { list: action.payload, retrieved: true };
    default:
      return state;
  }
}
