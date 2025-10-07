const mylog = value => {
  console.log(JSON.stringify(value, null, 2) + 'my log key');
};

export { mylog };
