class ReturnName {
  public static returnCreditorName(item: any): string {
    return (
      item?.c_last_name + ' ' + item?.c_first_name + ' ' + item?.c_middle_name
    );
  }
  public static returnDebitorName(item: any): string {
    return (
      item?.d_last_name + ' ' + item?.d_first_name + ' ' + item?.d_middle_name
    );
  }
}

export default ReturnName;
