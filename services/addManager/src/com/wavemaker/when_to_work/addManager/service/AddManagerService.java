package com.wavemaker.when_to_work.addManager.service;


import com.wavemaker.when_to_work.addManager.model.*;
import com.wavemaker.when_to_work.addManager.model.RootRequest;
import com.wavemaker.when_to_work.addManager.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface AddManagerService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("POST /managers")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(RootRequest body, @Param("Authorization") String Authorization);

}
