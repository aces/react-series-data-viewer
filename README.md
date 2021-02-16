# React series data viewer

Previous versions were implemented with a combination of svg (D3) and WebGL renderer (Three.js). 
Since #5c00801, the Series data viewer strictly uses svg (Visx|D3), to use features like clipPath (significantly simpler to use than Three.js masks) and css styling.

## Main dependencies

### Ramda (https://ramdajs.com)
A practical functional library for JavaScript programmers.

### Redux (https://redux.js.org)
A Predictable State Container for JS Apps

### Visx (https://airbnb.io/visx)
A collection of expressive, low-level visualization primitives for React.

### RxJS (https://rxjs-dev.firebaseapp.com/guide/overview)
RxJS is a library for composing asynchronous and event-based programs by using observable sequences. 
It provides one core type, the Observable, satellite types (Observer, Schedulers, Subjects) and operators to allow handling asynchronous events as collections.

### flow (https://flow.org)
A static type checker for javascript.
