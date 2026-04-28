package com.wavemaker.when_to_work.AddEmployee.service;


import com.wavemaker.when_to_work.AddEmployee.model.*;
import com.wavemaker.when_to_work.AddEmployee.model.RootRequest;
import com.wavemaker.when_to_work.AddEmployee.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface AddEmployeeService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("POST /employees")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "Authorization: {Authorization}"  })
  RootResponse invoke(RootRequest body, @Param("Authorization") String Authorization);

}
