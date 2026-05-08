package com.wavemaker.when_to_work.PatchEmployeeById.service;


import com.wavemaker.when_to_work.PatchEmployeeById.model.*;
import com.wavemaker.when_to_work.PatchEmployeeById.model.RootRequest;
import com.wavemaker.when_to_work.PatchEmployeeById.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface PatchEmployeeByIdService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("PATCH /employees/1")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "Authorization: {Authorization}"  })
  RootResponse invoke(RootRequest body, @Param("Authorization") String Authorization);

}
