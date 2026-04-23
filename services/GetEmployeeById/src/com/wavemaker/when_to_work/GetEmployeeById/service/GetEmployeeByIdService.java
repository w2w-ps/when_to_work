package com.wavemaker.when_to_work.GetEmployeeById.service;


import com.wavemaker.when_to_work.GetEmployeeById.model.*;
import com.wavemaker.when_to_work.GetEmployeeById.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetEmployeeByIdService {

  /**
   * 
   * 
    * @param id  (required)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("GET /employees/{id}")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("id") String id, @Param("Authorization") String Authorization);

}
